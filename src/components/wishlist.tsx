'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Eye, Pencil, Loader2, X, PlusCircle } from 'lucide-react';
import { updateWishlistItemAction, addWishlistItemAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { Separator } from './ui/separator';

function EditWishlistModal({
  item,
  open,
  onOpenChange,
  onSave,
}: {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedItem: any) => void;
}) {
  const [form, setForm] = useState(item);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm(item);
    }
  }, [item, open]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const fieldsToUpdate: Array<{ field: string; value: any }> = [];

    const tracked = ['name', 'price', 'priorityLevel', 'storeLocation', 'itemCategory', 'purchaseDate', 'isPurchased', 'supplierContact', 'discard', 'itemImage'];
    for (const field of tracked) {
      if (form[field] !== item[field]) {
        fieldsToUpdate.push({ field, value: form[field] });
      }
    }

    let hasError = false;
    for (const { field, value } of fieldsToUpdate) {
      const result = await updateWishlistItemAction({
        id: item.id,
        field,
        value,
      });
      if (result?.error) {
        toast({
          title: 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      toast({ title: 'Item Updated', description: 'Changes have been saved.' });
      onSave(form);
      onOpenChange(false);
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
          <DialogDescription>View and edit the details of this wishlist item.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPurchased"
              checked={form.isPurchased}
              onCheckedChange={(checked) => handleField('isPurchased', checked === true)}
            />
            <Label htmlFor="isPurchased">Purchased</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="discard"
              checked={form.discard}
              onCheckedChange={(checked) => handleField('discard', checked === true)}
            />
            <Label htmlFor="discard">Discarded</Label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={form.name || ''}
              onChange={e => handleField('name', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => handleField('price', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="priorityLevel">Priority Level</Label>
            <Input
              id="priorityLevel"
              value={form.priorityLevel || ''}
              onChange={e => handleField('priorityLevel', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="itemCategory">Category</Label>
            <Input
              id="itemCategory"
              value={form.itemCategory || ''}
              onChange={e => handleField('itemCategory', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="storeLocation">Store / Location</Label>
            <Input
              id="storeLocation"
              value={form.storeLocation || ''}
              onChange={e => handleField('storeLocation', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="supplierContact">Supplier Contact</Label>
            <Input
              id="supplierContact"
              value={form.supplierContact || ''}
              onChange={e => handleField('supplierContact', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate || ''}
              onChange={e => handleField('purchaseDate', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="itemImage">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="itemImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.itemImage || ''}
                onChange={e => handleField('itemImage', e.target.value)}
              />
              {form.itemImage && (
                <Button
                  variant="outline"
                  size="icon"
                  title="Remove Image"
                  onClick={() => handleField('itemImage', '')}
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
            {form.itemImage && (
              <div className="mt-2 aspect-video w-full relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.itemImage} alt="Wishlist Item" className="object-contain max-h-full" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Wishlist({
  initialItems = [],
  isEditable = true,
}: {
  initialItems?: any[];
  isEditable?: boolean;
}) {
  const [items, setItems] = useState(() => [...initialItems]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSaveItem = (updatedItem: any) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleAddItem = async () => {
    setIsAdding(true);
    const result = await addWishlistItemAction();
    if (result.success && result.newPageId) {
      toast({ title: 'Item Added', description: 'The new item has been saved.' });
      const newItem = {
        id: result.newPageId,
        name: 'Nuevo Item',
        price: 0,
        isPurchased: false,
        discard: false,
        priorityLevel: '',
        itemCategory: '',
        storeLocation: '',
        supplierContact: '',
        purchaseDate: '',
        itemImage: '',
      };
      setItems(prev => [newItem, ...prev]);
      setEditingItem(newItem);
      router.refresh();
    } else {
      toast({ title: 'Failed to Add', description: result.error || 'Could not save the new item.', variant: 'destructive' });
    }
    setIsAdding(false);
  };

  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState({ key: 'priorityLevel', order: 'desc' });
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPurchased, setShowPurchased] = useState(false);

  const itemsPerPage = 10;

  // Extract unique categories from items
  const itemCategories = useMemo(() => {
    const categories = new Set(items.map(item => item.itemCategory).filter(Boolean));
    return Array.from(categories);
  }, [items]);

  const handleSort = (key: string) => {
    setSort(prevSort => ({
      key,
      order: prevSort.key === key && prevSort.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items;

    // Filter out discarded
    filtered = filtered.filter(item => !item.discard);

    if (!showPurchased) {
      filtered = filtered.filter(item => !item.isPurchased);
    }

    if (filter) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.itemCategory === categoryFilter);
    }

    return filtered.sort((a, b) => {
      let aValue = a[sort.key as keyof typeof a];
      let bValue = b[sort.key as keyof typeof a];

      if (sort.key === 'priorityLevel') {
        aValue = parseInt(aValue as string, 10) || 0;
        bValue = parseInt(bValue as string, 10) || 0;
      }

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, filter, showPurchased, categoryFilter, sort]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return sortedAndFilteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredItems, page, itemsPerPage]);

  const totalPages = Math.ceil(sortedAndFilteredItems.length / itemsPerPage) || 1;

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2'>
          <div>
            <CardTitle>Wishlist</CardTitle>
            <CardDescription>
              Track items you want to buy.
            </CardDescription>
          </div>
          {isEditable && (
            <Button variant="outline" size="sm" onClick={handleAddItem} disabled={isAdding} className="sm:ml-auto">
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Añadir
            </Button>
          )}
        </div>
        <Separator className="my-4" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center flex-wrap">
          <Input
            placeholder="Search items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {itemCategories.map(c => (
                <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEditable && <div className="flex items-center space-x-2 sm:ml-auto">
            <Checkbox
              id="showPurchased"
              checked={showPurchased}
              onCheckedChange={(checked) => setShowPurchased(checked as boolean)}
            />
            <Label htmlFor="showPurchased">Show purchased</Label>
          </div>}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Item
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('itemCategory')}>
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('priorityLevel')}>
                    Priority
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('price')}>
                    Price (USD)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                {isEditable && <TableHead>Status</TableHead>}
                {isEditable && <TableHead className="text-right">Details</TableHead>}
                {isEditable && <TableHead className="text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEditable ? 6 : 4} className="text-center py-6 text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map(item => (
                  <TableRow key={item.id} className={item.isPurchased ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {item.itemImage ? (
                          <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.itemImage} alt="" className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded shrink-0 bg-muted" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.itemCategory}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.priorityLevel}
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(item.price)}
                    </TableCell>
                    {isEditable && <TableCell>
                      {item.isPurchased ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Purchased</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>}
                    {isEditable && <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Details"
                        onClick={() => setEditingItem(item)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TableCell>}
                    {isEditable && <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}

        {editingItem && (
          <EditWishlistModal
            item={editingItem}
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onSave={handleSaveItem}
          />
        )}
      </CardContent>
    </Card>
  );
}
